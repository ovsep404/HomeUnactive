<?php

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

class ForgotPasswordDTO
{
    #[Assert\NotBlank]
    #[Assert\Email]
    public ?string $email = null;
}
